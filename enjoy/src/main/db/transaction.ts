import { Transaction } from "sequelize";
import db from "./index";
import log from "@main/services/logger";

const logger = log.scope("Transaction");

/**
 * Execute a callback within a transaction and handle commit/rollback automatically
 *
 * @param callback Function to execute within the transaction
 * @returns The result of the callback
 */
export async function withTransaction<T>(
  callback: (transaction: Transaction) => Promise<T>
): Promise<T> {
  const transaction = await db.connection.transaction();

  try {
    const result = await callback(transaction);
    await transaction.commit();
    return result;
  } catch (error) {
    logger.error("Transaction failed, rolling back", error);
    await transaction.rollback();
    throw error;
  }
}

/**
 * Execute a callback within a transaction if one is not already provided
 *
 * @param transactionOrCallback Either an existing transaction or the callback to execute
 * @param maybeCallback The callback to execute if the first parameter is a transaction
 * @returns The result of the callback
 */
export async function withOptionalTransaction<T>(
  transactionOrCallback:
    | Transaction
    | ((transaction: Transaction) => Promise<T>),
  maybeCallback?: (transaction: Transaction) => Promise<T>
): Promise<T> {
  // If first arg is a transaction and second is a callback
  if (transactionOrCallback instanceof Transaction && maybeCallback) {
    return maybeCallback(transactionOrCallback);
  }

  // If first arg is a callback
  if (typeof transactionOrCallback === "function") {
    return withTransaction(
      transactionOrCallback as (transaction: Transaction) => Promise<T>
    );
  }

  throw new Error("Invalid arguments to withOptionalTransaction");
}
