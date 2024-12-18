class ApiFeatures {
    constructor(query, queryStr) {
        //query = query to be performed e.g Product.find()
        //queryStr = api url query e.g apiurl/category=Laptop
        this.query = query
        this.queryStr = queryStr
    }

    search() {
        const keyword = this.queryStr.keyword ? {
            name: {
                $regex: this.queryStr.keyword,
                $options: "i" //case insensitive while searching
            }
        } : {}

        this.query = this.query.find({ ...keyword })
        return this
    };

    filter() {
        const queryCopy = { ...this.queryStr };

        //Removing fields for Category
        ["keyword", "page", "limit"]?.forEach(key => delete queryCopy[key])

        //Filter for price & rating
        let queryStr = JSON.stringify(queryCopy)
        queryStr = queryStr?.replace(/\b(gt|gte|lt|lte)\b/g, key => `$${key}`)

        this.query = this.query.find(JSON.parse(queryStr))

        return this
    }

    pagination(resultsPerPage) {
        if (Number(this.queryStr.page)) {
            const currentPage = Number(this.queryStr.page) || 1
            const skip = (currentPage - 1) * resultsPerPage
            this.query = this.query.limit(resultsPerPage).skip(skip)
        }
        return this
    }
}

module.exports = ApiFeatures