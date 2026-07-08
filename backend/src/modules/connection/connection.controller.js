import * as connectionService from './connection.service.js';

const sendRequest = async (req, res) => {
  try {
    const { receiverId } = req.body;
    const connection = await connectionService.sendConnectionRequest(req.user.id, receiverId);
    res.json({ success: true, connection });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getPending = async (req, res) => {
  try {
    const requests = await connectionService.getPendingRequests(req.user.id);
    res.json({ success: true, requests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const respond = async (req, res) => {
  try {
    const { connectionId } = req.params;
    const { action } = req.body; // 'ACCEPT' or 'REJECT'
    const connection = await connectionService.respondToRequest(connectionId, req.user.id, action);
    res.json({ success: true, connection });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getMyConnections = async (req, res) => {
  try {
    const connections = await connectionService.getConnections(req.user.id);
    res.json({ success: true, connections });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export { sendRequest, getPending, respond, getMyConnections };
