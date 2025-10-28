const pagination = require('hexo-pagination');

const defaultConfig = {
  enable: true
};

function generator(locals) {
  const cfg = Object.assign({}, defaultConfig, this.config.i18n_archive_generator || {});
  if (!cfg.enable) return [];

  const config = this.config;
  const languages = config.language || ['en'];
  const defaultLang = Array.isArray(languages) ? languages[0] : languages;
  const perPage = cfg.per_page !== undefined ? cfg.per_page : config.per_page;
  const yearly = cfg.yearly !== false;
  const monthly = cfg.monthly !== false;
  const daily = cfg.daily === true;
  const archiveDir = 'archives/';
  const result = [];

  const fmtNum = num => num.toString().padStart(2, '0');

  languages.forEach(lang => {
    const allPosts = locals.posts
      .filter(post => (post.lang || defaultLang) === lang)
      .sort((a, b) => {
        // Posts with original_lang_url have lowest priority
        if (a.original_lang_url && !b.original_lang_url) return 1;
        if (!a.original_lang_url && b.original_lang_url) return -1;
        // Then sort by date descending
        return b.date.valueOf() - a.date.valueOf();
      });

    if (allPosts.length === 0) return;

    const langPrefix = lang === defaultLang ? '' : `${lang}/`;
    const { Query } = this.model('Post');

    function generate(path, posts, options = {}) {
      options.archive = true;
      options.lang = lang;
      result.push(...pagination(path, posts, {
        perPage,
        layout: ['archive', 'index'],
        format: 'page/%d/',
        data: options
      }));
    }

    generate(langPrefix + archiveDir, allPosts);

    const posts = {};
    allPosts.forEach(post => {
      const date = post.date;
      const year = date.year();
      const month = date.month() + 1;

      if (!posts[year]) {
        posts[year] = [[], [], [], [], [], [], [], [], [], [], [], [], []];
      }
      posts[year][0].push(post);
      posts[year][month].push(post);
      
      if (daily) {
        const day = date.date();
        if (!posts[year][month].day) {
          posts[year][month].day = {};
        }
        (posts[year][month].day[day] || (posts[year][month].day[day] = [])).push(post);
      }
    });

    if (yearly) {
      Object.keys(posts).forEach(year => {
        const yearData = posts[year];
        if (!yearData[0].length) return;
        
        generate(`${langPrefix}${archiveDir}${year}/`, new Query(yearData[0]), { year: +year });
        
        if (!monthly && !daily) return;
        
        for (let month = 1; month <= 12; month++) {
          const monthData = yearData[month];
          if (!monthData.length) continue;
          
          if (monthly) {
            generate(`${langPrefix}${archiveDir}${year}/${fmtNum(month)}/`, new Query(monthData), {
              year: +year,
              month
            });
          }
          
          if (!daily) continue;
          
          for (let day = 1; day <= 31; day++) {
            const dayData = monthData.day && monthData.day[day];
            if (!dayData || !dayData.length) continue;
            generate(`${langPrefix}${archiveDir}${year}/${fmtNum(month)}/${fmtNum(day)}/`, new Query(dayData), {
              year: +year,
              month,
              day
            });
          }
        }
      });
    }
  });

  return result;
}

if (typeof hexo !== 'undefined') {
  hexo.extend.generator.register('i18n-archive', generator);
}

module.exports = generator;
