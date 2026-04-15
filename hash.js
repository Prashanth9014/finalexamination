const bcrypt = require('bcrypt');

bcrypt.hash("ses@superadmin", 10)
  .then(hash => console.log(hash));
