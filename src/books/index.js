const express = require("express")
const fs = require("fs-extra")
const path = require("path")
const uuid = require("uuid/v4");
const { check, validationResult, sanitizeBody } = require("express-validator")

const booksJsonPath = path.join(__dirname, "books.json");
const CommentsJsonPath = path.join(__dirname, "../comments/comments.json");

const getBooks = async()=>{
    const buffer = await fs.readFile(booksJsonPath);
    return JSON.parse(buffer.toString())
};

const getCommentsForBook = async()=>{
    const buffer = await fs.readFile(CommentsJsonPath);
    return JSON.parse(buffer.toString())
};



const router = express.Router();

router.get("/", async (req, res)=>{
    res.send(await getBooks())
})

router.get("/:asin", async (req, res)=>{
    const books = await getBooks()
    const book = books.find(b => b.asin === req.params.asin);
    if (book)
        res.send(book)
    else
        res.status(404).send("Not found")
})
 
router.post("/",
    [check("asin").exists().withMessage("You should specify the asin"),
    check("title").exists().withMessage("Title is required"),
    check("category").exists().withMessage("Category is required"),
    check("price").isNumeric().withMessage("Price should be a number"),
    check("img").exists().withMessage("Img is required"),
    sanitizeBody("price").toFloat()]
    ,async(req, res) => {
        const errors = validationResult(req)
        if (!errors.isEmpty())
            res.status(400).send(errors)

        const books = await getBooks()
        const asinCheck = books.find(x => x.asin === req.body.asin) //get a previous element with the same asin
        if (asinCheck) //if there is one, just abort the operation
            res.status(500).send("ASIN should be unique")

        books.push(req.body)
        await fs.writeFile(booksJsonPath, JSON.stringify(books))
        res.status(201).send("Created")
    })

    // CommentsJsonPath


    router.post("/:id/comments",
    [check("username").exists().withMessage("You should specify your username"),
    check("text").isLength({ min: 5, max: 1000}).withMessage("text must be between 5 and 1000 chars")],async(req, res) => {
        const errors = validationResult(req)
        if (!errors.isEmpty())
            res.status(400).send(errors)

       const books = await getBooks()
        const comments = await getCommentsForBook()
       if ( 
           (!comments.find(x => x.bookId === req.params.id))
            && 
            (!books.find(x => x.asin === req.body.bookId)) 
            ){
            return res.status(404).send("Comment not found")
        }
       
        
        //const asinCheck = books.find(x => x.asin === req.body.bookId) 
        //if (asinCheck) //if there is one, just abort the operation
            //res.status(500).send("ASIN should be unique")
      
        const toAdd = {
            ...req.body,
            createdAt: new Date(),
            updatedAt: new Date(),
            comment_Id: uuid()
        }
    
        
        comments.push(toAdd)
        await fs.writeFile(CommentsJsonPath, JSON.stringify(comments))
        res.send(toAdd)

    })


    router.get("/:id/comments", async (req, res)=>{
        const books = await getBooks()
        const comments = await getCommentsForBook();
        const book = books.find(b => b.asin === req.params.id);
        const comment = comments.find(x => x.bookId === req.params.id)
        if (comment && book){
        let combined = {...book, comment}
            res.send(combined)}
        else
            res.status(404).send("Not found")
    });
    

    

    router.delete("/comments/:id2", async (req, res) => {
        const comments = await getCommentsForBook(); 
          const afterDelete = comments.filter(x => x.comment_Id !== req.params.id2);
          if (comments.length === afterDelete.length)
            return res.status(404).send("NOT FOUND");
          else {
            await fs.writeFile(CommentsJsonPath, JSON.stringify(afterDelete));
            res.send("Comment Deleted successfully through books!");
          }
        });









router.put("/:asin", async(req, res)=>{
    const books = await getBooks()
    const book = books.find(b => b.asin === req.params.asin);
    if (book)
    {
        const position = books.indexOf(book);
        const bookUpdated = Object.assign(book, req.body)
        books[position] = bookUpdated;
        await fs.writeFile(booksJsonPath, JSON.stringify(books))
        res.status(200).send("Updated")
    }
    else
        res.status(404).send("Not found")
} )

router.delete("/:asin", async(req, res) => {
    const books = await getBooks()
    const booksToBeSaved = books.filter(x => x.asin !== req.params.asin)
    if (booksToBeSaved.length === books.length)
        res.status(404).send("cannot find book " + req.params.asin)
    else { 
        await fs.writeFile(booksJsonPath, JSON.stringify(booksToBeSaved))
        res.send("Deleted")
    }
})



module.exports = router;