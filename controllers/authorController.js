const Author = require('../models/author');
const asyncHandler = require('express-async-handler');
const Book = require("../models/book");
const { body, validationResult } = require("express-validator");

// Display list of all Authors.
exports.author_list = asyncHandler(async (req, res, next) => {
  const authorList = await Author.find().sort({ family_name: 1 }).exec();
  res.render("layout", {
    title: "Author List",
    author_list: authorList,
    partial: "author_list",
  });
});

// Display detail page for a specific Author.
exports.author_detail = asyncHandler(async (req, res, next) => {
 const [author, authorBooks] = await Promise.all([
    Author.findById(req.params.id).exec(),
    Book.find({ author: req.params.id }, "title summary").exec(),
  ]);
  if (author == null) {
    const err = new Error("Author not found");
    err.status = 404;
    return next(err);
  }
  res.render("layout", {
    title: "Author Detail",
    author,
    author_books: authorBooks,
    partial: "author_detail",
  })
});

// Display Author create form on GET.
exports.author_create_get = (req, res, next) => {
  res.render("layout", { title: "Create Author", errors: null, partial: "author_form" });
};

// Handle Author create on POST.
exports.author_create_post = [
  // Validate and sanitize fields.
  body("first_name")
    .trim()
    .isLength({ min: 1 })
    .escape()
    .withMessage("First name must be specified.")
    .isAlphanumeric()
    .withMessage("First name has non-alphanumeric characters."),
  body("family_name")
    .trim()
    .isLength({ min: 1 })
    .escape()
    .withMessage("Family name must be specified.")
    .isAlphanumeric()
    .withMessage("Family name has non-alphanumeric characters."),
  body("date_of_birth", "Invalid date of birth")
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate(),
  body("date_of_death", "Invalid date of death")
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate(),

  // Process request after validation and sanitization.
  asyncHandler(async (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    const author = new Author({
      first_name: req.body.first_name,
      family_name: req.body.family_name,
      date_of_birth: req.body.date_of_birth,
      date_of_death: req.body.date_of_death,
    });

    if (!errors.isEmpty()) {
      res.render("layout", {
        title: "Create Author",
        author,
        errors: errors.array(),
        partial: "author_form",
      });
      return;
    } else {
      const authorExists = await Author.findOne({
        first_name: req.body.first_name,
        family_name: req.body.family_name,
      })
        .collation({ locale: "en", strength: 2 })
        .exec();
      if (authorExists) {
        // Author exists, redirect to its detail page.
        res.redirect(authorExists.url);
      } else {
        await author.save();
        // New author saved. Redirect to author detail page.
        res.redirect(author.url);
      }
    }
  }),

]

// Display Author delete form on GET.
exports.author_delete_get = asyncHandler( async (req, res, next) => {

  const [author, allBooksByAuthor] = await Promise.all([
    Author.findById(req.params.id).exec(),
    Book.find({ author: req.params.id }).exec(),
  ]);

  if (author == null) {
    res.redirect("/catalog/authors");
  }
  
  res.render("layout", {
    title: "Delete Author",
    author,
    author_books: allBooksByAuthor,
    partial: "author_delete",
    });
});

// Handle Author delete on POST.
exports.author_delete_post = asyncHandler( async (req, res, next) => {
  const [author, allBooksByAuthor] = await Promise.all([
    Author.findById(req.body.authorid).exec(),
    Book.find({ author: req.body.authorid }).exec(),
  ]);

  if(allBooksByAuthor.length > 0 ) {
    res.render("layout", {
      title: "Delete Author",
      author,
      author_books: allBooksByAuthor,
      partial: "author_delete",
      });
      return;
  } else {
    await Author.findByIdAndRemove(req.body.authorid);
    res.redirect("/catalog/authors");
  }
});

// Display Author update form on GET.
exports.author_update_get = asyncHandler( async(req, res, next) => {
  const author = await Author.findById(req.params.id).exec();
 
  if (author == null) {
    const err = new Error("Author not found");
    err.status = 404;
    return next(err);
  }
  res.render("layout", { title: "Update Author", author, partial: "author_form" })
  
});


// Handle Author update on POST.
exports.author_update_post = [
  body("first_name", "First name must not be empty.").trim().isLength({ min: 1 }).escape(),
  body("family_name", "Family name must not be empty.").trim().isLength({ min: 1 }).escape(),
  body("date_of_birth", "Invalid date of birth").optional({ checkFalsy: true }).isISO8601().toDate().escape(),
  body("date_of_death", "Invalid date of death").optional({ checkFalsy: true }).isISO8601().toDate().escape(),

  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    const author = new Author({
      first_name: req.body.first_name,
      family_name: req.body.family_name,
      date_of_birth: req.body.date_of_birth,
      date_of_death: req.body.date_of_death,
      _id: req.params.id,
    });

    if (!errors.isEmpty()) {
      const author = await Author.findById(req.params.id).exec();
      res.render("layout", {
        title: "Update Author",
        author,
        errors: errors.array(),
        partial: "author_form",
      });
    } else {
      const updateAuthor = await Author.findByIdAndUpdate(req.params.id, author, {});
      res.redirect(updateAuthor.url);
    }
  }),

];
