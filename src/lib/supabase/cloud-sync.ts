import type { User } from "@supabase/supabase-js";
import { db } from "@/lib/dexie/db";
import { supabase } from "@/lib/supabase/client";
import type { Category, Transaction } from "@/types/app";

export type DuplicateConflictStrategy = "keep-local" | "prefer-cloud" | "keep-both";

type CloudSnapshot = {
  transactions: Transaction[];
  categories: Category[];
  exportedAt: string;
};

type EncryptedPayload = {
  v: 1;
  iv: string;
  data: string;
};

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = "";

  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }

  return btoa(binary);
}

function base64ToUint8(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return Uint8Array.from(bytes).buffer as ArrayBuffer;
}

async function deriveKey(user: User): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const seed = `${user.id}:${user.email ?? "no-email"}:${process.env.NEXT_PUBLIC_SYNC_SECRET ?? "sync-v1"}`;
  const hash = await crypto.subtle.digest("SHA-256", encoder.encode(seed));

  return crypto.subtle.importKey("raw", hash, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

async function encryptSnapshot(snapshot: CloudSnapshot, user: User): Promise<string> {
  const key = await deriveKey(user);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoder = new TextEncoder();
  const plaintext = encoder.encode(JSON.stringify(snapshot));
  const encryptedBuffer = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, plaintext);

  const payload: EncryptedPayload = {
    v: 1,
    iv: uint8ToBase64(iv),
    data: uint8ToBase64(new Uint8Array(encryptedBuffer))
  };

  return JSON.stringify(payload);
}

async function decryptSnapshot(payloadRaw: string, user: User): Promise<CloudSnapshot> {
  const payload = JSON.parse(payloadRaw) as EncryptedPayload;

  if (payload.v !== 1) {
    throw new Error("Unsupported backup payload version.");
  }

  const key = await deriveKey(user);
  const iv = base64ToUint8(payload.iv);
  const data = base64ToUint8(payload.data);
  const decrypted = await crypto.subtle.decrypt(
    {
      name: "AES-GCM",
      iv: toArrayBuffer(iv)
    },
    key,
    toArrayBuffer(data)
  );
  const text = new TextDecoder().decode(decrypted);
  return JSON.parse(text) as CloudSnapshot;
}

async function buildSnapshot(): Promise<CloudSnapshot> {
  const [transactions, categories] = await Promise.all([
    db.transactions.toArray(),
    db.categories.toArray()
  ]);

  return {
    transactions,
    categories,
    exportedAt: new Date().toISOString()
  };
}

export async function syncSnapshotToCloud(): Promise<{ ok: boolean; message: string }> {
  if (!supabase) {
    return { ok: false, message: "Supabase is not configured." };
  }

  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false, message: "You must sign in first." };
  }

  const snapshot = await buildSnapshot();
  const encryptedPayload = await encryptSnapshot(snapshot, user);

  const { error } = await supabase.from("cloud_backups").upsert(
    {
      user_id: user.id,
      payload: encryptedPayload,
      updated_at: new Date().toISOString()
    },
    {
      onConflict: "user_id"
    }
  );

  if (error) {
    return { ok: false, message: error.message };
  }

  return {
    ok: true,
    message: `Synced ${snapshot.transactions.length} transactions and ${snapshot.categories.length} categories.`
  };
}

function pickNewerCategory(local: Category, remote: Category): Category {
  return (remote.updatedAt ?? "") > (local.updatedAt ?? "") ? remote : local;
}

function transactionFingerprint(transaction: Transaction): string {
  return [
    transaction.dateTrx,
    String(transaction.amount),
    transaction.title.trim().toLowerCase(),
    transaction.merchant.trim().toLowerCase()
  ].join("|");
}

export async function signOutFromSupabase(): Promise<{ ok: boolean; message: string }> {
  if (!supabase) {
    return { ok: false, message: "Supabase is not configured." };
  }

  const { error } = await supabase.auth.signOut();

  if (error) {
    return { ok: false, message: error.message };
  }

  return { ok: true, message: "Signed out." };
}

export async function downloadSnapshotFromCloudAndMerge(
  strategy: DuplicateConflictStrategy = "keep-local"
): Promise<{ ok: boolean; message: string }> {
  if (!supabase) {
    return { ok: false, message: "Supabase is not configured." };
  }

  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { ok: false, message: "You must sign in first." };
  }

  const { data, error } = await supabase
    .from("cloud_backups")
    .select("payload")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    return { ok: false, message: error.message };
  }

  if (!data?.payload) {
    return { ok: false, message: "No cloud backup found for this user." };
  }

  const snapshot = await decryptSnapshot(data.payload as string, user);
  let addedTransactions = 0;
  let replacedTransactions = 0;
  let skippedDuplicates = 0;

  await db.transaction("rw", db.categories, db.transactions, async () => {
    const [localCategories, localTransactions] = await Promise.all([
      db.categories.toArray(),
      db.transactions.toArray()
    ]);

    const categoriesById = new Map(localCategories.map((item) => [item.id, item]));

    for (const remoteCategory of snapshot.categories) {
      const local = categoriesById.get(remoteCategory.id);
      await db.categories.put(local ? pickNewerCategory(local, remoteCategory) : remoteCategory);
    }

    const transactionsById = new Map(localTransactions.map((item) => [item.id, item]));
    const localByFingerprint = new Map(
      localTransactions.map((item) => [transactionFingerprint(item), item])
    );

    for (const remoteTransaction of snapshot.transactions) {
      const local = transactionsById.get(remoteTransaction.id);

      if (!local) {
        const duplicate = localByFingerprint.get(transactionFingerprint(remoteTransaction));

        if (!duplicate) {
          await db.transactions.put(remoteTransaction);
          addedTransactions += 1;
          localByFingerprint.set(transactionFingerprint(remoteTransaction), remoteTransaction);
          continue;
        }

        if (strategy === "keep-both") {
          await db.transactions.put(remoteTransaction);
          addedTransactions += 1;
          continue;
        }

        if (strategy === "prefer-cloud") {
          await db.transactions.put({
            ...remoteTransaction,
            id: duplicate.id
          });
          replacedTransactions += 1;
          continue;
        }

        skippedDuplicates += 1;
        continue;
      }

      const shouldReplace = (remoteTransaction.createdAt ?? "") >= (local.createdAt ?? "");
      await db.transactions.put(shouldReplace ? remoteTransaction : local);

      if (shouldReplace) {
        replacedTransactions += 1;
      }
    }
  });

  return {
    ok: true,
    message:
      `Merged categories: ${snapshot.categories.length}. ` +
      `Transactions added: ${addedTransactions}, replaced: ${replacedTransactions}, skipped duplicates: ${skippedDuplicates}.`
  };
}
