#!/bin/bash
set -e

echo "=== Installing Docker ==="
sudo apt-get update -y
sudo apt-get install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
sudo apt-get update -y
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

sudo usermod -aG docker $USER

echo "=== Setting up 1GB swap ==="
if [ ! -f /swapfile ]; then
  sudo fallocate -l 1G /swapfile
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
fi

echo "=== Installing fail2ban ==="
sudo apt-get install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

echo "=== Installing ufw and locking down egress via DOCKER-USER ==="
sudo apt-get install -y ufw
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw --force enable

# Docker bypasses ufw by default via iptables — DOCKER-USER chain closes that gap.
# NOTE: network name below is project-folder-dependent (Compose names it
# <folder>_<network-key>). This repo folder should be net-certificate-generator-prod.
# Verify with `docker network ls` after first `docker compose up -d` and fix if it differs.
cat <<'EOF' | sudo tee -a /etc/ufw/after.rules

# --- DOCKER-USER egress lockdown (net-certificate-generator-prod) ---
*filter
:DOCKER-USER - [0:0]
-A DOCKER-USER -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT
-A DOCKER-USER -o net-certificate-generator-prod_app-network -j ACCEPT
-A DOCKER-USER -p udp --dport 53 -j ACCEPT
-A DOCKER-USER -p tcp --dport 53 -j ACCEPT
-A DOCKER-USER -p tcp --dport 443 -j ACCEPT
-A DOCKER-USER -p tcp --dport 587 -j ACCEPT
-A DOCKER-USER -p tcp --dport 465 -j ACCEPT
-A DOCKER-USER -j DROP
COMMIT
# --- end DOCKER-USER egress lockdown ---
EOF

sudo ufw reload

echo "=== Done. Log out and back in for docker group membership to take effect. ==="