import { parseFragment } from 'parse5';
import striptags from 'striptags';
import slug from 'slug';
import { isHeading, getHeadingLevel } from './utils';

// add func splitContent @jsxzljx
function splitContent(str){
  var bytesCount = 0;
  var res = new Array();
  for (var i = 0, p = 0; i < str.length; i++) {
        var c = str.charAt(i);
        if (/^[\u0000-\u00ff]$/.test(c)) {
              bytesCount += 1;
        }
        else {
              bytesCount += 2;
        }
        if (bytesCount > 5000 || i == (str.length - 1)){
              res.push(str.slice(p, i) + "\n");
              p = i;
              bytesCount = 0;
        }
  }
  return res;
}

const parserFactory = () => ({
  // Returns the number of fragments successfully parsed
  parse(post, index) {
    let fragment = {};
    let headingCount = 0;

    const cleanhtml = striptags(post.html, ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']);
    const nodes = parseFragment(cleanhtml).childNodes;

    if (nodes.length !== 0) {
      // can that be true even with an empty doc?
      // Set first hypothetical headless fragment attributes.
      if (!isHeading(nodes[0])) {
        fragment.id = post.slug;
        // we give a higher importance to the intro (the first headless fragment)
        // add url @jsxzljx
        fragment.url = post.slug;
        fragment.importance = 0;
        fragment.post_uuid = post.uuid;
        fragment.post_title = post.title;
        fragment.post_published_at = post.published_at;
      }

      nodes.forEach((node) => {
        if (isHeading(node)) {
          // Send previous fragment
          //split content @ jsxzljx
          //index.addFragment(fragment);
          if (fragment.content != undefined){
            var splited = splitContent(fragment.content)
            for (var i in splited) {
                  fragment.content = splited[i];
                  headingCount += 1;
                  // modify the id format here @jsxzljx
                  fragment.id = post.slug + '#slice-' + headingCount;
                  // add unique objectID for overwriting  @jsxzljx
                  fragment.objectID = post.slug + '#slice-' + headingCount;
                  index.addFragment(JSON.parse(JSON.stringify(fragment)));
            }
          }
          fragment = {};
          headingCount += 1;
          fragment.heading = node.childNodes[0].value;
          // add url @jsxzljx
          fragment.url = `${post.slug}#${slug(fragment.heading)}`;
          // modify the id format here @jsxzljx
          //fragment.id = post.slug + '#slice-' + headingCount;
          fragment.importance = getHeadingLevel(node.nodeName);
          fragment.post_uuid = post.uuid;
          fragment.post_title = post.title;
          fragment.post_published_at = post.published_at;
        } else {
          if (fragment.content === undefined) fragment.content = '';
          // If node not a heading, then it is a text node and always has a value property
          fragment.content += `${node.value} `;
        }
      });

      // Saving the last fragment (as saving only happens as a new heading
      // is found). This also takes care of heading-less articles.
      //split content @ jsxzljx
      //index.addFragment(fragment);
      if (fragment.content != undefined){
        var splited = splitContent(fragment.content)
        for (var i in splited) {
              fragment.content = splited[i];
              headingCount += 1;
              // modify the id format here @jsxzljx
              fragment.id = post.slug + '#slice-' + headingCount;
              // add unique objectID for overwriting  @jsxzljx
              fragment.objectID = post.slug + '#slice-' + headingCount;
              index.addFragment(JSON.parse(JSON.stringify(fragment)));
        }
      }
    }

    return index.fragmentsCount();
  },
});

export default parserFactory;
