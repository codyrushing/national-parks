module.exports = {
  slugify: string => string.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]|[^a-z]/g, "")
}
