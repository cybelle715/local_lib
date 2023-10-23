const Book = require('../models/book');
const Author = require('../models/author');
const Genre = require('../models/genre');
const BookInstance = require('../models/bookinstance');
const { body, validationResult } = require("express-validator");

const asyncHandler = require('express-async-handler');

exports.index = asyncHandler(async (req, res, next) => {
  const [
    numBooks,
    numBookInstances,
    numAvailableBookInstances,
    numAuthors,
    numGenres,
  ] = await Promise.all([
    Book.countDocuments({}).exec(),
    BookInstance.countDocuments({}).exec(),
    BookInstance.countDocuments({ status: 'Available' }).exec(),
    Author.countDocuments({}).exec(),
    Genre.countDocuments({}).exec(),
  ]);
  
  res.render('index', {
    title: 'Local Library Home',
    book_count: numBooks,
    book_instance_count: numBookInstances,
    book_instance_available_count: numAvailableBookInstances,
    author_count: numAuthors,
    genre_count: numGenres,
  })
});

// Display list of all books.
exports.book_list = asyncHandler(async (req, res, next) => {
  const allBooks = await Book.find({}, 'title author').sort({title:1}).populate('author').exec();
  res.render('layout', {title: "Book List", book_list: allBooks, partial: 'book_list'}); });


// Display detail page for a specific book.
exports.book_detail = asyncHandler(async (req, res, next) => {
  const [book, bookInstances] = await Promise.all([
    Book.findById(req.params.id).populate('author').populate('genre').exec(),
    BookInstance.find({book: req.params.id}).exec(),
  ]);
  if (book == null) {
    const err = new Error('Book not found');
    err.status = 404;
    return next(err);
  }
  res.render('layout', {title: 'Book Detail', book, book_instances: bookInstances, partial: 'book_detail'});
});

// Display book create form on GET.
exports.book_create_get = asyncHandler(async (req, res, next) => {
  const [allAuthors, allGenres] = await Promise.all([
    Author.find().exec(),
    Genre.find().exec(),
  ]);
  const book = {}
  res.render('layout', {title: 'Create Book', book, errors: null, authors: allAuthors, genres:allGenres, partial: 'book_form'});
});

// Handle book create on POST.
exports.book_create_post = [
  (req, res, next) => {
    if (!(req.body.genre instanceof Array)) {
      if (typeof req.body.genre === 'undefined') req.body.genre = [];
      else req.body.genre = new Array(req.body.genre);
    }
    next();
  },
  body('title', 'Title must not be empty.').trim().isLength({min: 1}).escape(),
  body('author', 'Author must not be empty.').trim().isLength({min: 1}).escape(),
  body('summary', 'Summary must not be empty.').trim().isLength({min: 1}).escape(),
  body('isbn', 'ISBN must not be empty').trim().isLength({min: 1}).escape(),
  body('genre.*').escape(),

  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);
   
    const book = new Book({
      title: req.body.title,
      author: req.body.author,
      summary: req.body.summary,
      isbn: req.body.isbn,
      genre: req.body.genre,
    })
    if (!errors.isEmpty()) {
      const [authors, genres] = await Promise.all([
        Author.find().exec(),
        Genre.find().exec(),
      ]);
      for (const genre of genres) {
        if (book.genre.indexOf(genre._id) > -1) {
          genre.checked = 'true';
        }
      }
      res.render("layout", {
        title: "Create Book",
        authors,
        genres,
        book,
        errors: errors.array(),
        partial: "book_form",
      });
      } else {
        await book.save();
        res.redirect(book.url);
      }
    })
];

// Display book delete form on GET.
exports.book_delete_get = asyncHandler(async (req, res, next) => {
  const [book, bookInstances] = await Promise.all([
    Book.findById(req.params.id).exec(),
    BookInstance.find({ book: req.params.id }).exec(),
  ]);
  if (book == null) {
    res.redirect('/catalog/books');
  }
  res.render('layout', {title: 'Delete Book', book, book_instances: bookInstances, partial: 'book_delete'});
});

// Handle book delete on POST.
exports.book_delete_post = asyncHandler(async (req, res, next) => {
  const [book, bookInstances] = await Promise.all([
    Book.findById(req.body.bookid).exec(),
    BookInstance.find({ book: req.body.bookid }).exec(),
  ]);
  if (bookInstances.length > 0) {
    res.render('layout', {
      title: 'Delete Book',
      book,
      book_instances: bookInstances,
      partial: 'book_delete', 
    });
  } else {
    await Book.findByIdAndRemove(req.body.bookid);
    res.redirect('/catalog/books');
  }
});

// Display book update form on GET.
exports.book_update_get = asyncHandler(async (req, res, next) => {
  const [book, allAuthors, allGenres] = await Promise.all([
    Book.findById(req.params.id).populate('author').populate('genre').exec(),
    Author.find().exec(),
    Genre.find().exec(),
  ]);
  if (book == null) {
    const err = new Error('Book not found');
    err.status = 404;
    return next(err);
  }
  for (const genre of allGenres) {
    for (const bookGenre of book.genre) {
      if (genre._id.toString() === bookGenre._id.toString()) {
        genre.checked = 'true';
      }
    }
  }
  res.render('layout', {title: 'Update Book', book, authors: allAuthors, genres: allGenres, partial: 'book_form'});
});

// Handle book update on POST.
exports.book_update_post = [
  (req, res, next) => {
    if (!(req.body.genre instanceof Array)) {
      if (typeof req.body.genre === "undefined") {
        req.body.genre = [];
      } else {
        req.body.genre = new Array(req.body.genre);
      }
    }
    next();
  },

  body("title", "Title must not be empty.").trim().isLength({ min: 1 }).escape(),
  body("author", "Author must not be empty.").trim().isLength({ min: 1 }).escape(),
  body("summary", "Summary must not be empty.").trim().isLength({ min: 1 }).escape(),
  body("isbn", "ISBN must not be empty").trim().isLength({ min: 1 }).escape(),
  body("genre.*").escape(),

  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    const book = new Book({
      title: req.body.title,
      author: req.body.author,
      summary: req.body.summary,
      isbn: req.body.isbn,
      genre: typeof req.body.genre === 'undefined' ? [] : req.body.genre,
      _id: req.params.id,
    });

    if (!errors.isEmpty()) {
      const [allAuthors, allGenres] = await Promise.all([
        Author.find().exec(),
        Genre.find().exec(),
      ]);

      for (const genre of allGenres) {
        if (book.genre.indexOf(genre._id) > -1) {
          genre.checked = 'true';
        }
      }
      res.render("layout", {
        title: "Update Book",
        authors: allAuthors,
        genres: allGenres,
        book,
        errors: errors.array(),
        partial: "book_form",
      });


    } else {
      const updatedBook = await Book.findByIdAndUpdate(req.params.id, book, {});
      res.redirect(updatedBook.url);
    }
}),
];
