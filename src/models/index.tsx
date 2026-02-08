interface collectionItems {
  name: string;
  description: string;
  collectionId: string;
  createBy: string;
  deletedBy: string;
  isPrivate: boolean;
  updatedBy: any;
  createdDateTime: string;
  deletedDateTime: string;
  isDeleted: boolean;
  updatedDateTime: string;
  userId: string;
}

interface collectionByIdItem {
  id: string;
  collectionId: string;
  imageId: string;
  createdDateTime: string;
  attribute: any;
  customization: any;
  collection: {
    name: string;
  };
  image: {
    name: string;
    link: string;
    thumblink: string;
    description: string;
    title: string;
  };
}

interface collectionItem {
  id: string;
  collectionId: string;
  imageId: string;
  image_size: number;
  artistName: string;
  createBy: string;
  createdDateTime: string;
  description: string;
  link: string;
  thumblink: string;
  image: string;
  image_type: string;
  name: string;
  title: string;
  userId: string;
  saveimage: any;
  view: any;
  share: any;
  _count: {
    comment: number;
    like: number;
  };
  isProfilePic: boolean;
  count: number;
  collectionsChild?: collectionByIdItem[];
}

export type {collectionItems, collectionByIdItem, collectionItem};
