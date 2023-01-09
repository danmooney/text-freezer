# text-freezer

> Prevent text nodes in HTML document from being edited

![Textfreezer_demo](https://user-images.githubusercontent.com/960790/211227322-17dd9942-70ee-4955-aee4-b8e1bf91e3d9.gif)

## Install
`npm install text-freezer`

## Usage
```
import {freeze} from 'text-freezer';
freeze(document.querySelector('elWhoseTextContentIWantToFreeze'));
```

Now, try to edit the text contained inside the element in your browser's DevTools and watch it immediately revert to its original value.
This can be useful for any page that needs to have its content protected against editing by scammers, or by any other actor with malicious intent.
