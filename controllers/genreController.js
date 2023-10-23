const Genre = require('../models/genre');
const asyncHandler = require('express-async-handler');
const Book = require("../models/book");
const { body, validationResult } = require("express-validator");

// Display list of all Genre.
exports.genre_list = asyncHandler(async (req, res, next) => {
  const genreList = await Genre.find().sort({ name: 1 }).exec();
  res.render('layout', {
    title: 'Genre List',
    genre_list: genreList,
    partial: 'genre_list',
  });
});

// Display detail page for a specific Genre.
exports.genre_detail = asyncHandler(async (req, res, next) => {
  const [genre, booksInGenre] = await Promise.all([
    Genre.findById(req.params.id).exec(),
    Book.find({ genre: req.params.id }, 'title summary').exec(),
  ]);
  if (genre == null) {
    const err = new Error('Genre not found');
    err.status = 404;
    return next(err);
  }
  res.render('layout', {
    title: 'Genre Detail',
    genre,
    genre_books: booksInGenre,
    partial: 'genre_detail',
});
});

// Display Genre create form on GET.
exports.genre_create_get = asyncHandler(async (req, res, next) => {
  res.render('layout', { title: 'Create Genre', errors: null, partial: 'genre_form' });
});

// Handle Genre create on POST.
exports.genre_create_post = [
  body('name', 'Genre name required - at least 3 characters').trim().isLength({ min: 3 }).escape(),

  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);
    const genre = new Genre({ name: req.body.name });
    if (!errors.isEmpty()) {
      res.render('layout', { title: 'Create Genre', genre, errors: errors.array(), partial: 'genre_form' });
      return;
    } else {
      const genreExists = await Genre.findOne({ name: req.body.name })
       .collation({ locale: "en", strength: 2 })
       .exec();
       if (genreExists) {
      // Genre exists, redirect to its detail page.
      res.redirect(genreExists.url);
      } else {
      await genre.save();
      // New genre saved. Redirect to genre detail page.
      res.redirect(genre.url);
    }
    }
  }),
];
  
// Display Genre delete form on GET.
exports.genre_delete_get = asyncHandler(async (req, res, next) => {
 const [genre, booksInGenre] = await Promise.all([
    Genre.findById(req.params.id).exec(),
    Book.find({ genre: req.params.id }).exec(),
  ]);
  if (genre == null) {
    res.redirect('/catalog/genres');
  }
  res.render('layout', {
    title: 'Delete Genre',
    genre,
    genre_books: booksInGenre,
    partial: 'genre_delete',
  });
});

// Handle Genre delete on POST.
exports.genre_delete_post = asyncHandler(async (req, res, next) => {
  const [genre, booksInGenre] = await Promise.all([
    Genre.findById(req.params.id).exec(),
    Book.find({ genre: req.params.id }).exec(),
  ]);
  if (booksInGenre.length > 0) {
    res.render('layout', {
      title: 'Delete Genre',
      genre,
      genre_books: booksInGenre,
      partial: 'genre_delete',
    });
  } else {
      await Genre.findByIdAndRemove(req.body.genreid);
      res.redirect('/catalog/genres');
    }
});

// Display Genre update form on GET.
exports.genre_update_get = asyncHandler(async (req, res, next) => {
  const [genre, booksInGenre] = await Promise.all([
    Genre.findById(req.params.id).exec(),
    Book.find({ genre: req.params.id }).exec(),
  ]);
  if (genre == null) {
    res.redirect('/catalog/genres');
  }
  res.render('layout', {
    title: 'Update Genre',
    genre,
    errors: null,
    genre_books: booksInGenre,
    partial: 'genre_form',
  });
});

// Handle Genre update on POST.
exports.genre_update_post = [
  body('name', 'Genre name required - at least 3 characters').trim().isLength({ min: 3 }).escape(),
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);
    const genre = new Genre({ name: req.body.name, _id: req.params.id });
    if (!errors.isEmpty()) {
      const booksInGenre = await Book.find({ genre: req.params.id }).exec();
      res.render('layout', {
        title: 'Update Genre',
        genre,
        errors: errors.array(),
        genre_books: booksInGenre,
        partial: 'genre_form',
      });
    } else {
      const updateGenre = await Genre.findByIdAndUpdate(req.params.id, genre, {});
      res.redirect(updateGenre.url);
    }
  }),
]
