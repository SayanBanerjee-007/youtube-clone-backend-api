const paginateArray = (array, page, limit, label = 'docs') => {
	const totalDocs = array.length
	const totalPages = Math.ceil(array.length / limit)
	const hasPrevPage = page > 1
	const hasNextPage = page < totalPages
	const prevPage = hasPrevPage ? page - 1 : null
	const nextPage = hasNextPage ? page + 1 : null

	const offset = (page - 1) * limit
	const paginatedVideos = array.slice(offset, offset + limit)

	return {
		[label]: paginatedVideos,
		totalDocs,
		limit,
		page,
		totalPages,
		hasPrevPage,
		hasNextPage,
		prevPage,
		nextPage,
	}
}

export { paginateArray }
