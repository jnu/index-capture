# index-capture

Bookmarklet for quickly archiving directories.
## LIMITATIONS & BUGS

1. The script uses JSZip to perform zipping client side. Zipping client-side is
kind of a funky idea in the first place, and as you'd expect, the major problem
with it is file size. Anything more than one or two MBs simply will not work.
The glimmer of hope I have in resolving this issue is using ActionScript. Updates
will follow.

2. The size of this bookmarklet is too much for older versions of IE. The solution
is to include a launcher script in the bookmarklet and nothing else. I clearly
have not done this yet, but it will be done in the future.

3. There are a couple of checkboxes on the panel right now, saying "Sub-index?"
and "Url-Macro?" These reflect future features. They are in development, so don't
try to use them. The former will allow you to traverse sub-directories: for example,
if a directory page has an alphabetical index of sub-directories and does not allow
you to see all of its contents at once, you will still be able to archive everything
by defining two (or more) levels of traversal. The "Url-macro?" feature will allow
you to input a URL-template such as "http://www.example.com/?a={1}" and a range
such as "A-Z" in order to traverse sub-directories more programmatically (which 
is sometimes necessary in order to pass other options to the server such as "show
all"). THESE CAPABILITIES ARE IN PROGRESS! HOPEFULLY THEY WILL BE FINISHED SOON!

4. There is a problem with the way bootstrap.js resolves jQuery conflicts. Sometimes
you have to try to run the bookmarklet multiple times before it will work.


Detailed documentation is included in the relevant scripts. I will edit and consolidate
and make it available here very soon.
