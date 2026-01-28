const TOP_LEVEL_FOLDER_ORDER = ["Projects", "Areas", "Resources", "Archive"];

const sortTree = (unsorted, depth = 0) => {
  //Sort by folder before file, then by name
  const orderedTree = Object.keys(unsorted)
    .sort((a, b) => {

      let a_pinned = unsorted[a].pinned || false;
      let b_pinned = unsorted[b].pinned || false;
      if (a_pinned != b_pinned) {
        if (a_pinned) {
          return -1;
        } else {
          return 1;
        }
      }

      const a_is_note = a.indexOf(".md") > -1;
      const b_is_note = b.indexOf(".md") > -1;

      if (depth === 0 && !a_is_note && !b_is_note) {
        const a_index = TOP_LEVEL_FOLDER_ORDER.indexOf(a);
        const b_index = TOP_LEVEL_FOLDER_ORDER.indexOf(b);
        if (a_index !== -1 || b_index !== -1) {
          if (a_index === -1) {
            return 1;
          }
          if (b_index === -1) {
            return -1;
          }
          if (a_index !== b_index) {
            return a_index - b_index;
          }
        }
      }

      if (a_is_note && !b_is_note) {
        return 1;
      }

      if (!a_is_note && b_is_note) {
        return -1;
      }

      //Regular expression that extracts any initial decimal number
      const aNum = parseFloat(a.match(/^\d+(\.\d+)?/));
      const bNum = parseFloat(b.match(/^\d+(\.\d+)?/));

      const a_is_num = !isNaN(aNum);
      const b_is_num = !isNaN(bNum);

      if (a_is_num && b_is_num && aNum != bNum) {
        return aNum - bNum; //Fast comparison between numbers
      }

      if (a.toLowerCase() > b.toLowerCase()) {
        return 1;
      }

      return -1;
    })
    .reduce((obj, key) => {
      obj[key] = unsorted[key];

      return obj;
    }, {});

  for (const key of Object.keys(orderedTree)) {
    if (orderedTree[key].isFolder) {
      orderedTree[key] = sortTree(orderedTree[key], depth + 1);
    }
  }

  return orderedTree;
};

function getFolders(note) {
  try {
    let folders = null;
    if (note.data["dg-path"]) {
      folders = note.data["dg-path"].split("/");
    } else {
      folders = note.filePathStem
        .split("notes/")[1]
        .split("/");
    }
    folders[folders.length - 1] += ".md";
    return folders;
  } catch {
    return null;
  }
}

function getPermalinkMeta(note, key) {
  let permalink = "/";
  let parts = note.filePathStem.split("/");
  let name = parts[parts.length - 1];
  let noteIcon = process.env.NOTE_ICON_DEFAULT;
  let sticker = null;
  let hide = false;
  let pinned = false;
  let folders = null;
  try {
    if (note.data.permalink) {
      permalink = note.data.permalink;
    }
    if (note.data.tags && note.data.tags.indexOf("gardenEntry") != -1) {
      permalink = "/";
    }    
    if (note.data.title) {
      name = note.data.title;
    }
    if (note.data.noteIcon) {
      noteIcon = note.data.noteIcon;
    }
    if (note.data.sticker) {
      sticker = note.data.sticker;
    }
    // Reason for adding the hide flag instead of removing completely from file tree is to
    // allow users to use the filetree data elsewhere without the fear of losing any data.
    if (note.data.hide) {
      hide = note.data.hide;
    }
    if (note.data.pinned) {
      pinned = note.data.pinned;
    }
    folders = getFolders(note);
  } catch {
    //ignore
  }

  return [{ permalink, name, noteIcon, sticker, hide, pinned }, folders];
}

function assignNested(obj, keyPath, value) {
  lastKeyIndex = keyPath.length - 1;
  for (var i = 0; i < lastKeyIndex; ++i) {
    key = keyPath[i];
    if (!(key in obj)) {
      obj[key] = { isFolder: true };
    }
    obj = obj[key];
  }
  obj[keyPath[lastKeyIndex]] = value;
}

function assignFolderMeta(obj, keyPath, value) {
  let current = obj;
  for (const key of keyPath) {
    if (!(key in current)) {
      current[key] = { isFolder: true };
    }
    current = current[key];
  }
  Object.assign(current, value, { isFolder: true });
}

function getFileTree(data) {
  const tree = {};
  const notes = data.collections.note || [];
  const folderPaths = new Set();
  notes.forEach((note) => {
    const folders = getFolders(note);
    if (!folders) {
      return;
    }
    const folderSegments = folders.slice(0, -1);
    const currentPath = [];
    folderSegments.forEach((segment) => {
      currentPath.push(segment);
      folderPaths.add(currentPath.join("/"));
    });
  });
  notes.forEach((note) => {
    const [meta, folders] = getPermalinkMeta(note);
    if (!folders) {
      return;
    }
    const noteFileName = folders[folders.length - 1].replace(/\.md$/, "");
    const parentFolderName =
      folders.length > 1 ? folders[folders.length - 2] : null;
    let folderMetaPath = null;
    if (parentFolderName && noteFileName === parentFolderName) {
      folderMetaPath = folders.slice(0, -1);
    } else if (folders.length === 1 && folderPaths.has(noteFileName)) {
      folderMetaPath = [noteFileName];
    }
    if (folderMetaPath && note.data.hide === undefined) {
      meta.hide = true;
    }
    assignNested(tree, folders, { isNote: true, ...meta });
    if (folderMetaPath && meta.sticker) {
      assignFolderMeta(tree, folderMetaPath, { sticker: meta.sticker });
    }
  });
  const fileTree = sortTree(tree);
  return fileTree;
}

exports.getFileTree = getFileTree;
