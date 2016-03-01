#!/usr/bin/perl

# Various utilities for Restcomm testing
# 
# TODO:
#

use warnings;
use strict;
use Getopt::Long;
use Time::HiRes qw(usleep nanosleep);


# globals
my $version = "0.1";

sub printUsage
{
	print "Usage: \$ toolbox.pl [ -t <command type> ] [-c <count>]\n";
}


# Provision 'count' clients at Restcomm, currently only count is dynamic
sub provisionClients
{
	my $count = $_[0];
	
	print "Provisioning " . $count . " Restcomm Clients\n";
	for (my $i = 1; $i <= $count; $i++) {
		my $cmd = 'curl -X POST http://ACae6e420f425248d6a26948c17a9e2acf:0d01c95aac798602579fe08fc2461036@127.0.0.1:8080/restcomm/2012-04-24/Accounts/ACae6e420f425248d6a26948c17a9e2acf/Clients.json -d "Login=user' . $i . '" -d "Password=1234"';
		qx($cmd);
	}
}

# Spawn 'count' chrome tabs running restcomm-web-sdk modified sample App that registers with Restcomm and waits for calls
sub spawnWebrtcEndpoints
{
	my $count = $_[0];
	# how long to sleep after opening each browser tab (to avoid REGISTER flood)
	my $delay = $_[1];
	print "Spawning " . $count . " WebRTC Endpoints. Interval is: " . $delay . " miliseconds\n";
	for (my $i = 1; $i <= $count; $i++) {
		my $cmd = 'open -a "Google Chrome" "http://127.0.0.1:7080/automated.html?username=user' . $i . '&password=1234"';
		qx($cmd);
		# usleep takes microseconds, so we multiply miliseconds * 1000
		usleep($delay * 1000);
	}
}


# --------------- MAIN CODE --------------- $
my $command_type = "";
my $count = "";
my $delay = "0";
#my $negative_match = 0;
#my $filename = "";
#my $base_filename = "";
#my @records = ();
my $argc = $#ARGV + 1;

if ($argc < 1) {
	printUsage();
	exit;
}

my $result = GetOptions("type|t=s" => \$command_type,
			"count|c=s" => \$count,
			"delay|d:s"	=> \$delay,
			"help|h" => sub { printUsage(); exit 1; });

if (!$result) {
	print STDERR "Error parsing command-line options\n";
	exit 1;
}

if ($command_type eq "provision-clients") {
	provisionClients($count);
}

if ($command_type eq "spawn-endpoints") {
	spawnWebrtcEndpoints($count, $delay);
}

