const BookInstance = require('../models/bookinstance');
const asyncHandler = require('express-async-handler');
const { body, validationResult } = require("express-validator");
const Book = require("../models/book");

// Display list of all BookInstances.
exports.bookinstance_list = asyncHandler(async (req, res, next) => {
  const allBookInstances = await BookInstance.find().populate("book").exec();
  res.render('layout', { title: "Book Instance List", bookinstance_list: allBookInstances, partial: 'book_instance_list' });
});

// Display detail page for a specific BookInstance.
exports.bookinstance_detail = asyncHandler(async (req, res, next) => {
  const bookInstance = await BookInstance.findById(req.params.id).populate("book").exec();
  if (bookInstance == null) {
    const err = new Error("Book copy not found");
    err.status = 404;
    return next(err);
  }
  res.render('layout', { title: 'Book Instance Detail', book_instance: bookInstance, partial: 'book_instance_detail' });
});

// Display BookInstance create form on GET.
exports.bookinstance_create_get = asyncHandler(async (req, res, next) => {
  const allBooks = await Book.find({}, "title").exec();
  const bookInstance = new BookInstance();
  const selected_book = bookInstance.book?._id;
  res.render('layout', { title: "Create Book Instance", errors: null, bookinstance: bookInstance, selected_book, book_list: allBooks, partial: 'book_instance_form' });
});

// Handle BookInstance create on POST.
exports.bookinstance_create_post = [
  // Validate and sanitize fields.
  body("book", "Book must be specified").trim().isLength({ min: 1 }).escape(),
  body("imprint", "Imprint must be specified").trim().isLength({ min: 1 }).escape(),
  body("status").escape(),
  body("due_back", "Invalid date").optional({ values: "falsy" }).isISO8601().toDate(),

  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    const bookInstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back,
    });

    if (!errors.isEmpty()) {
      const allBooks = await Book.find({}, "title").exec();

      res.render("layout", {
        title: "Create Book Instance",
        book_list: allBooks,
        selected_book: bookInstance.book._id,
        errors: errors.array(),
        bookinstance: bookInstance,
        partial: "book_instance_form",
      });
      return;
    } else {
      await bookInstance.save();
      res.redirect(bookInstance.url);
    }
  }),

]


// Display BookInstance delete form on GET.
exports.bookinstance_delete_get = asyncHandler(async (req, res, next) => {
  const bookInstance = await BookInstance.findById(req.params.id).populate('book').exec();
  if (bookInstance === null) {
    res.redirect("/catalog/bookinstances");
  }
  res.render('layout', { title: 'Delete Book Instance', book_instance: bookInstance, partial: 'book_instance_delete' });
});

// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = asyncHandler(async (req, res, next) => {
  await BookInstance.findByIdAndDelete(req.params.id);
  res.redirect("/catalog/bookinstances");
});

// Display BookInstance update form on GET.
exports.bookinstance_update_get = asyncHandler(async (req, res, next) => {
  const [bookInstance, allBooks] = await Promise.all([
    BookInstance.findById(req.params.id).populate('book').exec(),
    Book.find(),
  ]);
  if (bookInstance === null) {
    const err = new Error("Book copy not found");
    err.status = 404;
    return next(err);
  }
  res.render('layout', { title: 'Update Book Instance', book_list: allBooks, selected_book: bookInstance.book._id, bookinstance: bookInstance, errors: null, partial: 'book_instance_form' });
});

// Handle bookinstance update on POST.
exports.bookinstance_update_post = [
  (req, res, next) => {
    if (!(req.body.book instanceof Array)) {
      if (typeof req.body.book === "undefined") req.body.book = [];
    }
    else {
      req.body.book = new Array(req.body.book);
    }
    next();
  },

  body("book", "Book must be specified").trim().isLength({ min: 1 }).escape(),
  body("imprint", "Imprint must be specified").trim().isLength({ min: 1 }).escape(),
  body("status").escape(),
  body("due_back", "Invalid date").optional({ checkFalsy: true }).isISO8601().toDate(),

  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    const bookInstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back,
      _id: req.params.id,
    });
    
    if(!errors.isEmpty()){
      const [bookInstance, allBooks] = await Promise.all([
        BookInstance.findById(req.params.id).populate("book").exec(),
        Book.find().exec(),
      ]);
      res.render("layout", {
        title: "Update Book Instance",
        book_list: allBooks,
        selected_book: bookInstance.book._id,
        errors: errors.array(),
        bookinstance: bookInstance,
        partial: "book_instance_form",
      });
    } else {
      const updatedBookInstances = await BookInstance.findByIdAndUpdate(req.params.id, bookInstance, {});
      res.redirect(updatedBookInstances.url);
    } 


  }),
];

