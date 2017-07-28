# Log Watcher | tail -f

## Features

- A server side program to monitor the given log file capable of streaming
updates that happen in it. Runs on the same machine where the log file resides.
- A web based client that prints the updates in the file as when they happen
and not upon page refresh. The page is loaded once and keeps getting updated
in real-time.
- The server transmits only the modifications in the file and does not
re-transmit the entire file every time.
- Enables user to watch multiple files in different tabs
- If the file is truncated/ modified such that it's size is less than previous
known size, then apt message is displayed to the client and the page is
reloaded to display contents of the new instance.
- If a file is not found on the machine or any other errors occur while
opening/reading of the file, appropriate error messages are shown accordingly.

----

## Usage

`npm install` to install all the module dependencies

`$ chmod +x server.sh` gives execution permissions to the bash script.
`server.sh` ensures that the server is restarted even if it crashes
(due to unforeseen circumstances).

To start the server, execute `./server.sh` from the project folder.

The log watch server starts on default port 9000.

From a browser, navigate to [http://localhost:9000/](http://localhost:9000/).
To watch/monitor a file, append the filename in the URL as a path. For e.g:
[http://localhost:9000/log](http://localhost:9000/log) to watch a file
named "log" which exists on the server.

Note: The files to be monitored must be placed in the project folder where
`tail_f.js` file exists.
