#!/usr/bin/env ruby
# Tiny static server pinned to an absolute path (avoids getcwd sandbox issues)

require 'webrick'

ROOT = File.expand_path(File.dirname(__FILE__))
PORT = (ENV['PORT'] || 8765).to_i

server = WEBrick::HTTPServer.new(
  Port: PORT,
  DocumentRoot: ROOT,
  Logger: WEBrick::Log.new($stderr, WEBrick::Log::WARN),
  AccessLog: []
)

trap('INT')  { server.shutdown }
trap('TERM') { server.shutdown }

puts "serving #{ROOT} on http://localhost:#{PORT}"
server.start
