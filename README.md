# text-freezer

> Prevent text nodes in HTML document from being edited

## Install
`npm install text-freezer`

## Usage
```
import {freeze} from 'text-freezer';
freeze(document.querySelector('elWhoseTextContentIWantToFreeze'));
```

Now, try to edit the text contained inside the element in your browser's DevTools and watch it immediately revert to its original value.
This can be useful for any page that needs to have its content protected against editing by scammers, or by any other actor with malicious intent.
