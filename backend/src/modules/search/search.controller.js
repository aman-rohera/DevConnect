import * as searchService from './search.service.js';

export const searchUsers = async (req, res, next) => {
  try {
    const {
      q,
      location,
      currentCompany,
      skill,
      sort,
      page: pageQuery,
      limit: limitQuery
    } = req.query;

    const filters = {
      q,
      location,
      currentCompany,
      skill,
      sort
    };

    const pagination = {
      page: parseInt(pageQuery || '1', 10),
      limit: parseInt(limitQuery || '10', 10)
    };

    const result = await searchService.searchUsers(filters, pagination);

    return res.status(200).json({
      success: true,
      message: 'Users retrieved successfully',
      data: result
    });
  } catch (error) {
    next(error);
  }
};
