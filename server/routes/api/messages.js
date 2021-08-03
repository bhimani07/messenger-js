const router = require("express").Router();
const { Conversation, Message } = require("../../db/models");
const onlineUsers = require("../../onlineUsers");

// expects {recipientId, text, conversationId } in body (conversationId will be null if no conversation exists yet)
router.post("/", async (req, res, next) => {
  try {
    if (!req.user) {
      return res.sendStatus(401);
    }
    const senderId = req.user.id;
    const { recipientId, text, conversationId, sender } = req.body;

    // check if conversation already exist in database
    let conversation = await Conversation.findConversation(
      senderId,
      recipientId
    );

    // check if sender is authorized to post messages with conversationId specified in query parameter
    if (conversationId && conversation?.id !== conversationId) {
      return res.sendStatus(401).json("unauthorized access to the conversation");
    }

    // create conversation if it doesn't exist.
    if (!conversation) {
      conversation = await Conversation.create({
        user1Id: senderId,
        user2Id: recipientId,
      });
      if (onlineUsers.includes(sender.id)) {
        sender.online = true;
      }
    }

    const message = await Message.create({
      senderId,
      text,
      conversationId: conversation.id,
    });

    res.json({message, sender});
  } catch (error) {
    next(error);
  }
});

module.exports = router;