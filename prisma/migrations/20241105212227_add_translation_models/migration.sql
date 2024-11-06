-- CreateTable
CREATE TABLE "MessageTranslation" (
    "messageId" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "originalText" TEXT NOT NULL,
    "translatedText" TEXT NOT NULL,
    "languageCode" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "ConfiguredTranslatedChat" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "chatId" INTEGER NOT NULL,
    "targetLanguage" TEXT NOT NULL
);

-- CreateIndex
CREATE INDEX "MessageTranslation_messageId_idx" ON "MessageTranslation"("messageId");
