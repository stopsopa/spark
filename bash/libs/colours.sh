
# source "$DIR/../libs/colours.sh"

exec 3<> /dev/null
function green {
    printf "\e[32m$1\e[0m\n"
}

function red {
    printf "\e[31m$1\e[0m\n"
}

function yellow {
    printf "\e[33m$1\e[0m\n"
}

# from now on:
# { red "\n\n   hellow world\n\n"; } 2>&3

