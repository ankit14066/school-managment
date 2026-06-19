const getPagination = (page = 1, limit = 10) => {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 10));
  const skip = (pageNum - 1) * limitNum;
  return { page: pageNum, limit: limitNum, skip };
};

const paginatedResponse = (data, total, page, limit) => ({
  success: true,
  count: data.length,
  total,
  page,
  pages: Math.ceil(total / limit) || 1,
  data,
});

module.exports = { getPagination, paginatedResponse };
