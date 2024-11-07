import {
  sqliteTable,
  text,
  integer,
  primaryKey,
  blob,
} from "drizzle-orm/sqlite-core";
import { relations } from "drizzle-orm";

export const chat = sqliteTable(`Chat`, {
  ROWID: integer(`ROWID`).primaryKey(),
  guid: text(`guid`).notNull(),
  chatIdentifier: text(`chat_identifier`).notNull(),
  displayName: text(`display_name`),
  // sqlite integer can exceed js number range, so we use blob
  lastReadMessageTimestamp: blob(`last_read_message_timestamp`),
});

export const handle = sqliteTable(`Handle`, {
  ROWID: integer(`ROWID`).primaryKey(),
  id: text(`id`).notNull(),
});

export const message = sqliteTable(`Message`, {
  ROWID: integer(`ROWID`).primaryKey(),
  guid: text(`guid`).notNull(),
  text: text(`text`),
  handleId: integer(`handle_id`)
    .notNull()
    .references(() => handle.ROWID),
  date: integer().notNull(),
  attributedBody: blob(),
  isFromMe: integer(`is_from_me`),
});

export const chatMessageJoin = sqliteTable(
  `chat_message_join`,
  {
    chatId: integer(`chat_id`)
      .notNull()
      .references(() => chat.ROWID),
    messageId: integer(`message_id`)
      .notNull()
      .references(() => message.ROWID),
  },
  (table) => ({
    pk: primaryKey(table.chatId, table.messageId),
  })
);

export const chatRelations = relations(chat, ({ many }) => ({
  messages: many(chatMessageJoin),
}));

export const handleRelations = relations(handle, ({ many }) => ({
  messages: many(message),
}));

export const messageRelations = relations(message, ({ one, many }) => ({
  handle: one(handle, {
    fields: [message.handleId],
    references: [handle.ROWID],
  }),
  chats: many(chatMessageJoin),
}));

export const chatMessageJoinRelations = relations(
  chatMessageJoin,
  ({ one }) => ({
    chat: one(chat, {
      fields: [chatMessageJoin.chatId],
      references: [chat.ROWID],
    }),
    message: one(message, {
      fields: [chatMessageJoin.messageId],
      references: [message.ROWID],
    }),
  })
);
