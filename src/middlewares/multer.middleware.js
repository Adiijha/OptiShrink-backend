import multer from 'multer';

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "./public/temp")
    },
    filename: function (req, file, cb) {
    //   const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9) // generate unique name
      cb(null, file.originalname) // file.originalname is the name of the file on user's computer
    }
  })
  
 export const upload = multer({ 
    storage, 
})