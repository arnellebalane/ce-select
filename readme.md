## ce-select

customizable `<select>` element


##### Usage

1. Load the `ce-select` CSS and Javascript files.
    ```html
    <link rel="stylesheet" href="path/to/ce-select.css">
    <script src="path/to/ce-select.js"></script>
    ```

2. Add the class `ce-select` to `<select>` elements that you want to customize.
This library will automatically transform that native element into a custom
HTML markup.
    ```html
    <select class="ce-select">
        <option value="one">Option One</option>
        <option value="two">Option Two</option>
        <option value="three">Option Three</option>
    </select>
    ```

3. If in the future new `<select>` elements are added into the page and you
want them to be customized as well, simply call `ceselect.refresh()` to
generate custom HTML markups for them.
