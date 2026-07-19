import * as jobService from './job.service.js';

const create = async (req, res) => {
  try {
    const job = await jobService.createJob(req.user.id, req.body);
    res.status(201).json({ success: true, job });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const list = async (req, res) => {
  try {
    const { location, type, employmentType } = req.query;
    const jobs = await jobService.getJobs({ location, type, employmentType });
    res.json({ success: true, jobs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const save = async (req, res) => {
  try {
    const { id } = req.params;
    const saved = await jobService.saveJob(req.user.id, id);
    res.json({ success: true, saved });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const getSaved = async (req, res) => {
  try {
    const saved = await jobService.getSavedJobs(req.user.id);
    res.json({ success: true, saved });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const apply = async (req, res) => {
  try {
    const { id } = req.params;
    const { resumeUrl } = req.body;
    if (!resumeUrl) {
      return res.status(400).json({ success: false, message: 'Resume URL is required' });
    }
    const application = await jobService.applyToJob(req.user.id, id, resumeUrl);
    res.status(201).json({ success: true, application });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

const listApplications = async (req, res) => {
  try {
    const { id } = req.params;
    const applications = await jobService.getApplications(id, req.user.id);
    res.json({ success: true, applications });
  } catch (error) {
    const status = error.message.includes('Unauthorized') ? 403 : 400;
    res.status(status).json({ success: false, message: error.message });
  }
};

const getApplicationsForUser = async (req, res) => {
  try {
    const applications = await jobService.getUserApplications(req.user.id);
    res.json({ success: true, applications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export { create, list, save, getSaved, apply, listApplications, getApplicationsForUser };
