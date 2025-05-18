'use strict';
module.exports = (sequelize, DataTypes) => {
  const Post = sequelize.define('Post', {
    title: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('draft', 'published'),
      allowNull: false,
      defaultValue: 'draft'
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false
    }
  }, {
    tableName: 'Posts',
    timestamps: true
  });

  Post.associate = function(models) {
    Post.belongsTo(models.User, { foreignKey: 'user_id' });
    Post.hasMany(models.Comment, { foreignKey: 'post_id', onDelete: 'RESTRICT', onUpdate: 'RESTRICT' });
  };

  return Post;
};
