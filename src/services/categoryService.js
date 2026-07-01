import { Category } from '../models/index.js';

export async function getAllCategories() {
  return await Category.findAll({ order: [['name', 'ASC']] });
}

export async function getCategoryById(id) {
  const category = await Category.findByPk(id);
  if (!category) {
    throw new Error(`Category not found with id: ${id}`);
  }
  return category;
}

export async function createCategory({ name, description }) {
  const exists = await Category.findOne({ where: { name } });
  if (exists) {
    throw new Error(`Category with name '${name}' already exists`);
  }
  return await Category.create({ name, description });
}

export async function updateCategory(id, { name, description }) {
  const category = await getCategoryById(id);
  
  if (name && name !== category.name) {
    const exists = await Category.findOne({ where: { name } });
    if (exists) {
      throw new Error(`Category with name '${name}' already exists`);
    }
    category.name = name;
  }
  
  if (description !== undefined) {
    category.description = description;
  }

  return await category.save();
}

export async function deleteCategory(id) {
  const category = await getCategoryById(id);
  await category.destroy();
}
