const homePage = (req, res) => {
  return res.render('home', { title: 'Kizuna Rail' });
};

const aboutPage = (req, res) => {
  return res.render('about', { title: 'About' });
};

const testErrorPage = (req, res, next) => {
  const error = new Error('This is a test error so you can see what it looks like.');
  error.status = 500;
  return next(error);
};

export { homePage, aboutPage, testErrorPage };
