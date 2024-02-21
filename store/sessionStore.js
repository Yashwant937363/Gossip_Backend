// abstract class
class UserStore {
    getUser(uid) { }
    findUser(uid) { }
    saveUser(uid, session) { }
    findAllUsers() { }
}


class ServerUserStore extends UserStore {
    constructor() {
        super()
        this.users = new Map()
    }

    findUser(uid, socketuid) {
        const regex = new RegExp(`^${uid}`, 'i');
        const results = Array.from(this.users.values()).filter((item) => {
            if (socketuid !== item.uid) {
                return regex.test(item.uid);
            }
        }) || [];
        const Users = results.map((user) => ({
            uid: user.uid,
            profile: user.profile,
            username: user.username,
        }));
        return Users
    }

    getUser(uid) {
        return this.users.get(uid)
    }

    saveUser(uid, session) {
        this.users.set(uid, session)
    }

    userDisconnected(uid) {
        this.users.delete(uid)        
    }

    findAllUsers() {
        return [...this.users.values()]
    }
}

const UsersStore = new ServerUserStore()

module.exports = {
    UsersStore
}