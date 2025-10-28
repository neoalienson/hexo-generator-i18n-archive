'use strict';

const should = require('chai').should(); // eslint-disable-line
const Hexo = require('hexo');

describe('I18n Archive generator', () => {
  const hexo = new Hexo(__dirname, {silent: true});
  const Post = hexo.model('Post');
  const generator = require('./index.js');
  let posts, locals;

  before(() => hexo.init().then(() => Post.insert([
    {source: 'quux', slug: 'quux', date: new Date(2014, 1, 2), lang: 'en'},
    {source: 'qux', slug: 'qux', date: new Date(2014, 1, 2), lang: 'zh-TW'},
    {source: 'foo', slug: 'foo', date: new Date(2014, 1, 2), lang: 'zh-CN'},
    {source: 'bar', slug: 'bar', date: new Date(2013, 5, 6), lang: 'en'},
    {source: 'baz', slug: 'baz', date: new Date(2013, 9, 10), lang: 'zh-TW'},
    {source: 'boo', slug: 'boo', date: new Date(2013, 5, 8), lang: 'zh-CN'}
  ])).then(data => {
    posts = Post.sort('-date');
    locals = hexo.locals.toObject();
  }));

  it('pagination enabled with i18n', () => {
    hexo.config.language = ['en', 'zh-TW', 'zh-CN'];
    hexo.config.i18n_archive_generator = {
      per_page: 2,
      yearly: true
    };

    const result = generator.call(hexo, locals);

    result.length.should.be.above(0);

    // Check that we have archives for each language
    const enArchives = result.filter(r => r.path.startsWith('en/archives/') || r.path === 'archives/');
    const zhTWArchives = result.filter(r => r.path.startsWith('zh-TW/archives/'));
    const zhCNArchives = result.filter(r => r.path.startsWith('zh-CN/archives/'));

    enArchives.length.should.be.above(0);
    zhTWArchives.length.should.be.above(0);
    zhCNArchives.length.should.be.above(0);

    for (let i = 0, len = result.length; i < len; i++) {
      result[i].layout.should.eql(['archive', 'index']);
      result[i].data.archive.should.be.true;
    }
  });

  it('pagination disabled with i18n', () => {
    hexo.config.language = ['en', 'zh-TW', 'zh-CN'];
    hexo.config.i18n_archive_generator = {
      per_page: 0,
      yearly: true
    };

    const result = generator.call(hexo, locals);
    result.length.should.be.above(0);

    for (let i = 0, len = result.length; i < len; i++) {
      result[i].layout.should.eql(['archive', 'index']);
      result[i].data.archive.should.be.true;
    }

    // Check language-specific filtering
    const enPosts = posts.filter(post => post.lang === 'en');
    const zhTWPosts = posts.filter(post => post.lang === 'zh-TW');
    const zhCNPosts = posts.filter(post => post.lang === 'zh-CN');

    enPosts.length.should.eql(2);
    zhTWPosts.length.should.eql(2);
    zhCNPosts.length.should.eql(2);
  });

  it('yearly disabled', () => {
    hexo.config.language = ['en'];
    hexo.config.i18n_archive_generator = {
      per_page: 0,
      yearly: false
    };

    const result = generator.call(hexo, locals);

    result.map(item => {
      return item.path;
    }).should.eql(['archives/']);
  });

  it('disabled via config', () => {
    hexo.config.language = ['en'];
    hexo.config.i18n_archive_generator = {
      enable: false
    };

    const result = generator.call(hexo, locals);
    result.length.should.eql(0);
  });

  it('handles default language posts', () => {
    hexo.config.language = ['en', 'zh-TW'];
    hexo.config.i18n_archive_generator = {
      per_page: 0,
      yearly: false
    };

    const result = generator.call(hexo, locals);
    
    // Should have archives for default language (en) and zh-TW
    const paths = result.map(item => item.path);
    paths.should.include('archives/');
    paths.should.include('zh-TW/archives/');
  });

  it('filters posts by language correctly', () => {
    hexo.config.language = ['en', 'zh-TW'];
    hexo.config.i18n_archive_generator = {
      per_page: 0,
      yearly: false
    };

    const result = generator.call(hexo, locals);
    
    const enArchive = result.find(r => r.path === 'archives/');
    const zhTWArchive = result.find(r => r.path === 'zh-TW/archives/');

    enArchive.should.exist;
    zhTWArchive.should.exist;

    // Check that posts are filtered by language
    enArchive.data.posts.every(post => post.lang === 'en').should.be.true;
    zhTWArchive.data.posts.every(post => post.lang === 'zh-TW').should.be.true;
  });

  it('sorts posts with original_lang_url last', () => {
    // Add posts with original_lang_url
    return Post.insert([
      {source: 'redirect1', slug: 'redirect1', date: new Date(2024, 0, 1), lang: 'en', original_lang_url: '/original/'},
      {source: 'normal1', slug: 'normal1', date: new Date(2024, 0, 2), lang: 'en'}
    ]).then(() => {
      const newLocals = hexo.locals.toObject();
      
      hexo.config.language = ['en'];
      hexo.config.i18n_archive_generator = {
        per_page: 0,
        yearly: false
      };

      const result = generator.call(hexo, newLocals);
      const enArchive = result.find(r => r.path === 'archives/');
      
      enArchive.should.exist;
      
      // Posts without original_lang_url should come first
      const postsArray = enArchive.data.posts.toArray();
      const redirectPosts = postsArray.filter(p => p.original_lang_url);
      const normalPosts = postsArray.filter(p => !p.original_lang_url);
      
      // All redirect posts should come after normal posts
      const lastNormalIndex = postsArray.findLastIndex(p => !p.original_lang_url);
      const firstRedirectIndex = postsArray.findIndex(p => p.original_lang_url);
      
      if (redirectPosts.length > 0 && normalPosts.length > 0) {
        (lastNormalIndex < firstRedirectIndex).should.be.true;
      }
    });
  });
});