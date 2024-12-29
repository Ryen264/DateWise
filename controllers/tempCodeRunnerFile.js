 const firstUserEmail = (await Users.find())[0].USER_EMAIL;
        console.log(firstUserEmail);
