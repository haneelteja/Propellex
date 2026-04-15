import { Request, Response } from 'express'
import Property from '../models/Property.model.js'
import { AuthRequest } from '../middleware/auth.middleware.js'

export const getProperties = async (req: Request, res: Response) => {
  try {
    const {
      page = '1',
      limit = '12',
      type,
      status,
      minPrice,
      maxPrice,
      city,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query

    const pageNum = parseInt(page as string)
    const limitNum = parseInt(limit as string)
    const skip = (pageNum - 1) * limitNum

    // Build filter
    const filter: any = {}
    if (type) filter.type = type
    if (status) filter.status = status
    if (city) filter['location.city'] = new RegExp(city as string, 'i')
    if (minPrice || maxPrice) {
      filter.price = {}
      if (minPrice) filter.price.$gte = Number(minPrice)
      if (maxPrice) filter.price.$lte = Number(maxPrice)
    }

    // Build sort
    const sort: any = {}
    sort[sortBy as string] = sortOrder === 'asc' ? 1 : -1

    const properties = await Property.find(filter)
      .populate('agent', 'name email phone')
      .sort(sort)
      .skip(skip)
      .limit(limitNum)

    const total = await Property.countDocuments(filter)

    res.json({
      properties,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    })
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch properties' })
  }
}

export const getPropertyById = async (req: Request, res: Response) => {
  try {
    const property = await Property.findById(req.params.id).populate(
      'agent',
      'name email phone avatar'
    )

    if (!property) {
      return res.status(404).json({ message: 'Property not found' })
    }

    res.json({ property })
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch property' })
  }
}

export const createProperty = async (req: AuthRequest, res: Response) => {
  try {
    const propertyData = {
      ...req.body,
      agent: req.user?._id,
    }

    const property = await Property.create(propertyData)

    res.status(201).json({
      message: 'Property created successfully',
      property,
    })
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to create property' })
  }
}

export const updateProperty = async (req: AuthRequest, res: Response) => {
  try {
    const property = await Property.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )

    if (!property) {
      return res.status(404).json({ message: 'Property not found' })
    }

    res.json({
      message: 'Property updated successfully',
      property,
    })
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to update property' })
  }
}

export const deleteProperty = async (req: AuthRequest, res: Response) => {
  try {
    const property = await Property.findByIdAndDelete(req.params.id)

    if (!property) {
      return res.status(404).json({ message: 'Property not found' })
    }

    res.json({ message: 'Property deleted successfully' })
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to delete property' })
  }
}

export const searchProperties = async (req: Request, res: Response) => {
  try {
    const {
      query,
      type,
      minPrice,
      maxPrice,
      bedrooms,
      bathrooms,
      city,
      minArea,
      maxArea,
    } = req.query

    const filter: any = { status: 'available' }

    // Text search
    if (query) {
      filter.$or = [
        { title: new RegExp(query as string, 'i') },
        { description: new RegExp(query as string, 'i') },
        { 'location.address': new RegExp(query as string, 'i') },
        { 'location.city': new RegExp(query as string, 'i') },
      ]
    }

    // Filters
    if (type) filter.type = type
    if (city) filter['location.city'] = new RegExp(city as string, 'i')
    if (bedrooms) filter['specifications.bedrooms'] = { $gte: Number(bedrooms) }
    if (bathrooms) filter['specifications.bathrooms'] = { $gte: Number(bathrooms) }
    if (minPrice || maxPrice) {
      filter.price = {}
      if (minPrice) filter.price.$gte = Number(minPrice)
      if (maxPrice) filter.price.$lte = Number(maxPrice)
    }
    if (minArea || maxArea) {
      filter['specifications.area'] = {}
      if (minArea) filter['specifications.area'].$gte = Number(minArea)
      if (maxArea) filter['specifications.area'].$lte = Number(maxArea)
    }

    const properties = await Property.find(filter)
      .populate('agent', 'name email phone')
      .sort({ createdAt: -1 })
      .limit(50)

    res.json({ properties, count: properties.length })
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Search failed' })
  }
}

export const getFeaturedProperties = async (req: Request, res: Response) => {
  try {
    const properties = await Property.find({ featured: true, status: 'available' })
      .populate('agent', 'name email phone avatar')
      .sort({ createdAt: -1 })
      .limit(6)

    res.json({ properties })
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to fetch featured properties' })
  }
}

export const incrementViews = async (req: Request, res: Response) => {
  try {
    const property = await Property.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    )

    if (!property) {
      return res.status(404).json({ message: 'Property not found' })
    }

    res.json({ views: property.views })
  } catch (error: any) {
    res.status(500).json({ message: error.message || 'Failed to increment views' })
  }
}




