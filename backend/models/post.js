'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Post extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      models.Post.belongsTo(models.User, {foreignKey:'userId'})
      models.Post.hasMany(models.Comment)
      models.Post.hasMany(models.Like)
    }
  };
  Post.init({
    userId: DataTypes.INTEGER,
    content: DataTypes.TEXT,
    imageUrl: DataTypes.STRING,
    likes: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'Post',
  });
  return Post;
};