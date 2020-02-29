## @sammacbeth/dat-seeder

A CLI tool for seeding several dats from a single machine.

### Install

```
npm install -g @sammacbeth/dat-seeder
```

### Usage

```bash
$ dat-seeder --help
Usage: dat-seeder [options] [addresses...]

Options:
  -f --file <dats>          File containing a list of dats to seed
  -d --cachedir <cachedir>  Folder to store dats (default: "./dat")
  -p --port <port>          Swarm listen port
  -h, --help                output usage information
```

You can either specify dat addresses to seed from the command line, or provide
a file that contains addresses on each line:

```bash
dat-seeder dat.foundation sammacbeth.eu
```

or

```bash
printf "dat.foundation\nsammacbeth.eu" > dats.txt
dat-seeder -f dats.txt
```

### License

MIT