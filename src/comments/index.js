const express = require ("express");
const fs = require ("fs-extra");
const path = require ("path");
const { check, validationResult, sanitizeBody } = require("express-validator");
const uuid = require("uuid/v4");

const commentPath = path.join(__dirname, "comments.json");
const bookPathComment = path.join(__dirname, "../books/books.json");



const getAllComments = async ()=>{
    const buffer = await fs.readFile(commentPath);
    return JSON.parse(buffer.toString())
};



const getBookComments = async ()=>{
    const buffer = await fs.readFile(bookPathComment);
    return JSON.parse(buffer.toString())
};



const router = express.Router();



router.get("/", async (req, res)=>{
    //get all comments
    res.send(await getAllComments())
 });



 router.get("/:id", async (req, res)=>{
    //get single review
    const comments = await getAllComments();
    const aComment = comments.find(x => x.comment_Id === req.params.id)
    if (aComment)
        res.send(aComment)
    else
        res.status(404).send("Not found")
});



 
//  - CommentID //Server Generated
//  - BookID //ASIN
//  - UserName
//  - Text
//  - Date //Server Generated

 router.post("/",
    [check("username").exists().withMessage("You should specify your username"),
    check("text").isLength({ min: 5, max: 1000}).withMessage("text must be between 5 and 1000 chars")],
    async(req, res) => {
        const errors = validationResult(req)
        if (!errors.isEmpty())
            res.status(400).send(errors)

            const books = await getBookComments()
            if (!books.find(x => x.asin === req.body.bookId))
                return res.status(404).send("Comment not found")
        
            const toAdd = {
                ...req.body,
                createdAt: new Date(),
                updatedAt: new Date(),
                comment_Id: uuid()
            }
        
            const newComment = await getAllComments()
            newComment.push(toAdd)
            await fs.writeFile(commentPath, JSON.stringify(newComment))
            res.send(toAdd)

    });


    router.put("/:id", async (req, res)=>{
        //Is there any book with the given bookId? 
        const books = await getBookComments()
    
        if (req.body.bookId && !books.find(x => x.asin === req.body.bookId))
            return res.status(404).send("Book not found")
    
        const comments = await getAllComments();
        console.log(comments)
        const theComment = comments.find(c => c.comment_Id === req.params.id)
        if (theComment){
            delete req.body.comment_Id
            delete req.body.createdAt
            req.body.updatedAt = new Date()
            const updatedVersion = Object.assign(theComment, req.body) //<= COPY ALL THE PROPS FROM req.body ON THE ACTUAL review!!
            const index = comments.indexOf(theComment)
            comments[index] = updatedVersion;
            await fs.writeFile(commentPath, JSON.stringify(comments))
            res.send(updatedVersion)
        }
        else
            res.status(404).send("Not found")
    });



    router.delete("/:id", async (req, res) => {
    const comments = await getAllComments(); 
      const afterDelete = comments.filter(x => x.comment_Id !== req.params.id);
      if (comments.length === afterDelete.length)
        return res.status(404).send("NOT FOUND");
      else {
        await fs.writeFile(commentPath, JSON.stringify(afterDelete));
        res.send("Comment Deleted successfully!");
      }
    });








 module.exports = router;