Vagrant.configure(2) do |config|
  config.vm.box = "ubuntu/trusty64"
  config.vm.synced_folder ".", "/vagrant/vbox"
  config.vm.network "private_network", ip: ENV["VM_TESTTTT"] || "172.20.0.30"
  config.vm.provider "virtualbox" do |vb|
    vb.name = "vagrant-nightmare"
    vb.memory = "2524"
    # vb.customize ["setextradata", :id, "VBoxInternal2/SharedFoldersEnableSymlinksCreate/v-root", "1"]
  end
  config.vm.hostname = "vagrant-nightmare"
end