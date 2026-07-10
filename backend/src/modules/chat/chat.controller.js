import * as chatService from './chat.service.js';

const startConversation = async (req, res) => {
  try {
    const { targetUserId, title } = req.body;
    if (!targetUserId) {
      return res.status(400).json({ success: false, message: 'Target user ID is required' });
    }
    const conversation = await chatService.createConversation(req.user.id, targetUserId, title);
    res.json({ success: true, conversation });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getMyConversations = async (req, res) => {
  try {
    const conversations = await chatService.getConversations(req.user.id);
    res.json({ success: true, conversations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const sendMessage = async (req, res) => {
  try {
    const { conversationId, content, type } = req.body;
    if (!conversationId || !content) {
      return res.status(400).json({ success: false, message: 'Conversation ID and content are required' });
    }
    const message = await chatService.createMessage(conversationId, req.user.id, content, type);
    res.status(201).json({ success: true, message });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getConversationMessages = async (req, res) => {
  try {
    const { id } = req.params;
    const messages = await chatService.getMessages(id);
    res.json({ success: true, messages });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export { startConversation, getMyConversations, sendMessage, getConversationMessages };
