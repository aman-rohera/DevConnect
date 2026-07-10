import * as requestService from './company-request.service.js';

export const createRequest = async (req, res, next) => {
  try {
    const request = await requestService.createRequest(req.user.id, req.body);
    res.status(201).json({
      success: true,
      message: 'Company creation request submitted successfully',
      request
    });
  } catch (error) {
    if (error.message.includes('already exists') || error.message.includes('pending')) {
      return res.status(400).json({ success: false, message: error.message });
    }
    next(error);
  }
};

export const getMyRequests = async (req, res, next) => {
  try {
    const requests = await requestService.getUserRequests(req.user.id);
    res.status(200).json({
      success: true,
      requests
    });
  } catch (error) {
    next(error);
  }
};
