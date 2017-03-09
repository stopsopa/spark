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
  config.vm.provision "shell", inline: <<-SHELL
    echo "---------------- start ------------- vvv";
    
    apt-get update &&\
        apt-get install -y libgtk2.0-0 libgconf-2-4 \
        libasound2 libxtst6 libxss1 libnss3 xvfb        
    
    sed -ri "s/bind-address\\s*=\\s*127.0.0.1/# bind-address = 127\\.0\\.0\\.1/g" /etc/mysql/my.cnf
    SHOW GRANTS FOR 'root'@'localhost';
    mysql -u root -p -e "GRANT ALL PRIVILEGES ON *.* TO root@'%' IDENTIFIED BY '6yhn' WITH GRANT OPTION;"
    mysql -u root -p -e "CREATE DATABASE database;"
    service mysql restart
    
    curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash -
    
    apt-get install -y nodejs  

    npm install -g yarn      
       
    echo -e "Xvfb -ac -screen scrn 1280x2000x24 :9.0 & disown\\nexit 0" > /etc/rc.local
    
    Xvfb -ac -screen scrn 1280x2000x24 :9.0 & disown
    
    echo -e "\\nexport DISPLAY=:9.0" >> /home/vagrant/.bashrc
    
    echo -e "\\nexport DISPLAY=:9.0" >> /root/.bashrc
    
    export DISPLAY=:9.0 

    cd /vagrant/vbox
    
    echo -e "cd /vagrant/vbox\\n" > /home/vagrant/vbox
    
    chmod a+x /home/vagrant/vbox 
    
    echo -e "cd /vagrant/vbox\\n" > /root/vbox
    
    chmod a+x /root/vbox  
    
    # sudo -i
    # apt-get install -y mysql-server
    # sed -ri "s/bind-address\\s*=\\s*127.0.0.1/# bind-address = 127\\.0\\.0\\.1/g" /etc/mysql/my.cnf
    # SHOW GRANTS FOR 'root'@'localhost';
    # mysql -u root -p -e "GRANT ALL PRIVILEGES ON *.* TO root@'%' IDENTIFIED BY '6yhn' WITH GRANT OPTION;"
    # mysql -u root -p -e "CREATE DATABASE databasename /*\\!40100 COLLATE 'utf8_polish_ci' */;"
    # service mysql restart
    # mysqldump -C -h source_host -u source_user -psource_pass source_db | mysql -h localhost -u root -ptarget_pass vagrant_beta_absolvent_pl

    upgrade from 5.5.46 to 5.6.25
    sudo -i
    apt-get update        
    apt-get -y upgrade
    http://stackoverflow.com/a/20037235
    echo "mysql-server-5.5 mysql-server/root_password password root" | debconf-set-selections
    echo "mysql-server-5.5 mysql-server/root_password_again password root" | debconf-set-selections
    apt-get install -y mysql-server-5.6            
    test version SHOW VARIABLES LIKE "%version%";    
    
    echo "---------------- end --------------- ^^^";
  SHELL
end