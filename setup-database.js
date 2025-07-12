const { Sequelize, DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: './db/database.db',
    logging: false
});

const User = sequelize.define('User', {
    phoneNumber: {
        type: DataTypes.STRING,
        primaryKey: true,
        allowNull: false
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    hooks: {
        beforeCreate: async (user) => {
            const salt = await bcrypt.genSalt(10);
            user.password = await bcrypt.hash(user.password, salt);
        }
    },
    timestamps: false
});

const setupDatabase = async () => {
    try {
        await sequelize.authenticate();
        await User.sync({ force: false });

        const [user, created] = await User.findOrCreate({
            where: { phoneNumber: '09120000000' },
            defaults: {
                name: 'کاربر تستی',
                password: '12345'
            }
        });

        if (created) {
            console.log('Sample user created.');
        } else {
            console.log('Sample user already exists.');
        }

    } catch (error) {
        console.error('An error occurred during database setup:', error);
    } finally {
        await sequelize.close();
    }
};

setupDatabase();