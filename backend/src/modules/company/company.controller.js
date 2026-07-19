import * as companyService from './company.service.js';

const create = async (req, res) => {
  try {
    const company = await companyService.createCompany(req.user.id, req.body);
    res.status(201).json({ success: true, company });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const company = await companyService.getCompany(id);
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }
    res.json({ success: true, company });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const company = await companyService.getCompanyBySlug(slug);
    if (!company) {
      return res.status(404).json({ success: false, message: 'Company not found' });
    }
    res.json({ success: true, company });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const update = async (req, res) => {
  try {
    const { id } = req.params;
    const company = await companyService.updateCompany(id, req.user.id, req.body);
    res.json({ success: true, company });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const follow = async (req, res) => {
  try {
    const { id } = req.params;
    await companyService.followCompany(id, req.user.id);
    res.json({ success: true, message: 'Followed company successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const unfollow = async (req, res) => {
  try {
    const { id } = req.params;
    await companyService.unfollowCompany(id, req.user.id);
    res.json({ success: true, message: 'Unfollowed company successfully' });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getDashboard = async (req, res) => {
  try {
    const { id } = req.params;
    const dashboard = await companyService.getCompanyDashboard(id, req.user.id);
    res.json({ success: true, dashboard });
  } catch (error) {
    const status = error.message.includes('Unauthorized') ? 403 : 400;
    res.status(status).json({ success: false, message: error.message });
  }
};

const invite = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, role } = req.body;
    const member = await companyService.inviteToCompany(id, req.user.id, email, role);
    res.status(201).json({ success: true, member });
  } catch (error) {
    const status = error.message.includes('Unauthorized') ? 403 : 400;
    res.status(status).json({ success: false, message: error.message });
  }
};

export { create, getById, getBySlug, update, follow, unfollow, getDashboard, invite };
