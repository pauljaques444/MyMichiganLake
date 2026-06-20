-- Run in Supabase SQL Editor after listings.sql

CREATE TABLE conversations (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id  uuid REFERENCES listings(id) ON DELETE CASCADE NOT NULL,
  buyer_id    uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  seller_id   uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at  timestamptz DEFAULT now(),
  UNIQUE (listing_id, buyer_id)
);

CREATE TABLE messages (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id uuid REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id       uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  body            text NOT NULL,
  read_at         timestamptz,
  created_at      timestamptz DEFAULT now()
);

-- RLS: conversations
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view conversations" ON conversations
  FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

CREATE POLICY "Buyers can start conversations" ON conversations
  FOR INSERT WITH CHECK (auth.uid() = buyer_id);

-- RLS: messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view messages" ON messages
  FOR SELECT USING (
    conversation_id IN (
      SELECT id FROM conversations
      WHERE buyer_id = auth.uid() OR seller_id = auth.uid()
    )
  );

CREATE POLICY "Participants can send messages" ON messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    conversation_id IN (
      SELECT id FROM conversations
      WHERE buyer_id = auth.uid() OR seller_id = auth.uid()
    )
  );

CREATE POLICY "Participants can mark messages read" ON messages
  FOR UPDATE USING (
    conversation_id IN (
      SELECT id FROM conversations
      WHERE buyer_id = auth.uid() OR seller_id = auth.uid()
    )
  );

-- Indexes
CREATE INDEX messages_conversation_id_idx ON messages (conversation_id, created_at);
CREATE INDEX conversations_buyer_idx       ON conversations (buyer_id);
CREATE INDEX conversations_seller_idx      ON conversations (seller_id);
CREATE INDEX conversations_listing_idx     ON conversations (listing_id);

-- Unread count helper (called from frontend via supabase.rpc)
CREATE OR REPLACE FUNCTION unread_message_count()
RETURNS integer
LANGUAGE sql SECURITY DEFINER
AS $$
  SELECT COUNT(*)::integer
  FROM messages m
  JOIN conversations c ON m.conversation_id = c.id
  WHERE (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
    AND m.sender_id != auth.uid()
    AND m.read_at IS NULL;
$$;
