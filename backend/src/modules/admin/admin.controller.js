import * as adminService from './admin.service.js';

const getPagination = (req) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  return { skip, take: limit, page, limit };
};

export const getDashboardStats = async (req, res, next) => {
  try {
    const stats = await adminService.getDashboardStats();
    res.status(200).json({ success: true, stats });
  } catch (err) { next(err); }
};

export const getUsers = async (req, res, next) => {
  try {
    const { skip, take, page, limit } = getPagination(req);
    const { users, total } = await adminService.getUsers({ skip, take, search: req.query.search });
    res.status(200).json({ success: true, users, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
};

export const getUserById = async (req, res, next) => {
  try {
    const user = await adminService.getUserById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.status(200).json({ success: true, user });
  } catch (err) { next(err); }
};

export const updateUser = async (req, res, next) => {
  try {
    const user = await adminService.updateUser(req.params.id, req.body, req.user.id);
    res.status(200).json({ success: true, message: 'User updated successfully', user });
  } catch (err) { next(err); }
};

export const deleteUser = async (req, res, next) => {
  try {
    await adminService.deleteUser(req.params.id, req.user.id);
    res.status(200).json({ success: true, message: 'User deleted successfully' });
  } catch (err) { next(err); }
};

export const getCompanyRequests = async (req, res, next) => {
  try {
    const { skip, take, page, limit } = getPagination(req);
    const { requests, total } = await adminService.getCompanyRequests({ skip, take, status: req.query.status });
    res.status(200).json({ success: true, requests, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
};

export const getCompanyRequestById = async (req, res, next) => {
  try {
    const request = await adminService.getCompanyRequestById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });
    res.status(200).json({ success: true, request });
  } catch (err) { next(err); }
};

export const approveCompanyRequest = async (req, res, next) => {
  try {
    const result = await adminService.approveCompanyRequest(req.params.id, req.user.id);
    res.status(200).json({ success: true, message: 'Company request approved', ...result });
  } catch (err) {
    if (err.message.includes('not found') || err.message.includes('not pending')) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next(err);
  }
};

export const rejectCompanyRequest = async (req, res, next) => {
  try {
    const result = await adminService.rejectCompanyRequest(req.params.id, req.body.reason, req.user.id);
    res.status(200).json({ success: true, message: 'Company request rejected', request: result });
  } catch (err) {
    if (err.message.includes('not found') || err.message.includes('not pending')) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next(err);
  }
};

export const getCompanies = async (req, res, next) => {
  try {
    const { skip, take, page, limit } = getPagination(req);
    const { companies, total } = await adminService.getCompanies({ skip, take, search: req.query.search });
    res.status(200).json({ success: true, companies, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
};

export const getCompanyById = async (req, res, next) => {
  try {
    const company = await adminService.getCompanyById(req.params.id);
    if (!company) return res.status(404).json({ success: false, message: 'Company not found' });
    res.status(200).json({ success: true, company });
  } catch (err) { next(err); }
};

export const updateCompanyStatus = async (req, res, next) => {
  try {
    const company = await adminService.updateCompanyStatus(req.params.id, req.body.isSuspended, req.user.id);
    res.status(200).json({ success: true, message: 'Company status updated', company });
  } catch (err) { next(err); }
};

export const deleteCompany = async (req, res, next) => {
  try {
    await adminService.deleteCompany(req.params.id, req.user.id);
    res.status(200).json({ success: true, message: 'Company deleted successfully' });
  } catch (err) { next(err); }
};

export const getJobs = async (req, res, next) => {
  try {
    const { skip, take, page, limit } = getPagination(req);
    const { jobs, total } = await adminService.getJobs({ skip, take });
    res.status(200).json({ success: true, jobs, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
};

export const updateJobStatus = async (req, res, next) => {
  try {
    const job = await adminService.updateJobStatus(req.params.id, req.body.isSuspended, req.user.id);
    res.status(200).json({ success: true, message: 'Job status updated', job });
  } catch (err) { next(err); }
};

export const deleteJob = async (req, res, next) => {
  try {
    await adminService.deleteJob(req.params.id, req.user.id);
    res.status(200).json({ success: true, message: 'Job deleted successfully' });
  } catch (err) { next(err); }
};

export const getPosts = async (req, res, next) => {
  try {
    const { skip, take, page, limit } = getPagination(req);
    const { posts, total } = await adminService.getPosts({ skip, take });
    res.status(200).json({ success: true, posts, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
};

export const deletePost = async (req, res, next) => {
  try {
    await adminService.deletePost(req.params.id, req.user.id);
    res.status(200).json({ success: true, message: 'Post deleted successfully' });
  } catch (err) { next(err); }
};

export const getReports = async (req, res, next) => {
  try {
    const { skip, take, page, limit } = getPagination(req);
    const { reports, total } = await adminService.getReports({ skip, take, status: req.query.status });
    res.status(200).json({ success: true, reports, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (err) { next(err); }
};

export const getReportById = async (req, res, next) => {
  try {
    const report = await adminService.getReportById(req.params.id);
    if (!report) return res.status(404).json({ success: false, message: 'Report not found' });
    res.status(200).json({ success: true, report });
  } catch (err) { next(err); }
};

export const resolveReport = async (req, res, next) => {
  try {
    const report = await adminService.resolveReport(req.params.id, req.user.id);
    res.status(200).json({ success: true, message: 'Report resolved', report });
  } catch (err) { next(err); }
};

export const rejectReport = async (req, res, next) => {
  try {
    const report = await adminService.rejectReport(req.params.id, req.user.id);
    res.status(200).json({ success: true, message: 'Report rejected', report });
  } catch (err) { next(err); }
};
