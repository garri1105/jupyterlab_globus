# jupyterlab_globus

Incorporates Globus functionality. Compatible with Windows, iOS and Linux.
For snapshots of the project visit the following link and see slide 24 and onwards!

https://www.slideshare.net/ianfoster/scaling-collaborative-data-science-with-globus-and-jupyter.


## Prerequisites

* JupyterLab 0.34.7

## Installation

```bash
jupyter labextension install jupyterlab_globus
```

## Notes

The Globus Connect Personal feature has been temporarily deleted due to compatibility issues. A later version will support it. Instead of using the convenient Globus Connect Personal file browser from the Globus extension, use the default JupyterLab file browser.

## Development

For a development install (requires npm version 4 or later), do the following in the repository directory:

```bash
npm install
npm run build
jupyter labextension link .
```

To rebuild the package and the JupyterLab app:

```bash
npm run build
jupyter lab build
```

