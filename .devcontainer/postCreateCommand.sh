apt-get update && apt-get install zsh -y
# apt-get install openssh-client -y
yes | sh -c "$(curl -fsSL https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" "" --unattended
zsh
# clear && zsh